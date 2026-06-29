import { describe, expect, it, vi } from "vitest";

import { createElevenLabs } from "../../packages/provider/elevenlabs/src";

describe("ElevenLabs endpoint wiring", () => {
  it("gets docs redirect metadata", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 301,
        headers: {
          location: "https://elevenlabs.io/docs/api-reference/text-to-speech",
        },
      })
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.docs();

    expect(result).toEqual({
      status: 301,
      location: "https://elevenlabs.io/docs/api-reference/text-to-speech",
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/docs");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.redirect).toBe("manual");
    expect(init.body).toBeUndefined();
    expect(provider.get.docs).toBe(provider.docs);
  });

  it("gets v1 models", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            model_id: "eleven_multilingual_v2",
            name: "Eleven Multilingual v2",
            can_do_text_to_speech: true,
            model_rates: {
              character_cost_multiplier: 1,
              cost_discount_multiplier: 1,
            },
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.models();

    expect(result[0]?.model_id).toBe("eleven_multilingual_v2");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/models");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.models).toBe(provider.v1.models);
  });

  it("gets v1 voice metadata by voice id", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          voice_id: "voice/123",
          name: "Bella",
          category: "premade",
          labels: {
            language: "en",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.voices("voice/123", {
      with_settings: false,
    });

    expect(result.voice_id).toBe("voice/123");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/voices/voice%2F123?with_settings=false"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.voices).toBe(provider.v1.voices);
    expect(
      provider.v1.voices.schema.safeParse({ with_settings: "false" }).success
    ).toBe(false);
  });

  it("gets v1 voice settings by voice id", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          stability: 0.5,
          use_speaker_boost: true,
          similarity_boost: 0.75,
          style: 0,
          speed: 1,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.voices.settings("voice/123");

    expect(result).toEqual({
      stability: 0.5,
      use_speaker_boost: true,
      similarity_boost: 0.75,
      style: 0,
      speed: 1,
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/voices/voice%2F123/settings"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.voices.settings).toBe(provider.v1.voices.settings);
  });

  it("gets separated speaker audio for a PVC sample speaker", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          audio_base_64: "YWJj",
          media_type: "audio/mpeg",
          duration_secs: 5,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.voices.pvc.samples.speakers.audio(
      "voice/123",
      "sample 456",
      "speaker/789"
    );

    expect(result).toEqual({
      audio_base_64: "YWJj",
      media_type: "audio/mpeg",
      duration_secs: 5,
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/voices/pvc/voice%2F123/samples/sample%20456/speakers/speaker%2F789/audio"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.voices.pvc.samples.speakers.audio).toBe(
      provider.v1.voices.pvc.samples.speakers.audio
    );
  });

  it("gets v2 voices with search and pagination query parameters", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          voices: [
            {
              voice_id: "voice_123",
              name: "Rachel",
              category: "premade",
            },
          ],
          has_more: false,
          total_count: 1,
          next_page_token: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v2.voices({
      page_size: 2,
      search: "Rachel",
      sort: "name",
      sort_direction: "asc",
      voice_type: "default",
      category: "premade",
      fine_tuning_state: null,
      include_total_count: false,
      voice_ids: ["voice_123", "voice_456"],
    });

    expect(result.voices[0]?.voice_id).toBe("voice_123");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v2/voices?page_size=2&search=Rachel&sort=name&sort_direction=asc&voice_type=default&category=premade&include_total_count=false&voice_ids=voice_123&voice_ids=voice_456"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v2.voices).toBe(provider.v2.voices);
    expect(
      provider.v2.voices.schema.safeParse({ page_size: 101 }).success
    ).toBe(false);
  });

  it("gets user subscription data and computes remaining characters", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          tier: "starter",
          character_count: 1000,
          character_limit: 10000,
          status: "active",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.user.subscription();

    expect(result).toEqual({
      tier: "starter",
      character_count: 1000,
      character_limit: 10000,
      status: "active",
      remaining_character_count: 9000,
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/user/subscription");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.user.subscription).toBe(
      provider.v1.user.subscription
    );
  });

  it("posts workspace analytics requests filters", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          columns: ["request_id", "timestamp", "success"],
          column_types: ["String", "DateTime", "Bool"],
          rows: [["req_123", "2026-06-01T12:00:00Z", true]],
          column_units: [null, null, null],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.workspace.analytics.requests({
      start_time: 1764547200000,
      limit: 10,
      sort: "asc",
      filters: [
        {
          column: "success",
          operation: "eq",
          values: [true],
        },
      ],
      search: "text-to-speech",
    });

    expect(result.columns).toEqual(["request_id", "timestamp", "success"]);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/workspace/analytics/requests"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      start_time: 1764547200000,
      limit: 10,
      sort: "asc",
      filters: [
        {
          column: "success",
          operation: "eq",
          values: [true],
        },
      ],
      search: "text-to-speech",
    });
    expect(provider.post.v1.workspace.analytics.requests).toBe(
      provider.v1.workspace.analytics.requests
    );
    expect(
      provider.v1.workspace.analytics.requests.schema.safeParse({}).success
    ).toBe(false);
  });

  it("posts text-to-speech requests to the voice-specific create endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
      })
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.textToSpeech("voice_123", {
      text: "Hello from Apicity.",
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      enable_logging: false,
    });

    expect(result.byteLength).toBe(3);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/voice_123?output_format=mp3_44100_128&enable_logging=false"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      text: "Hello from Apicity.",
      model_id: "eleven_multilingual_v2",
    });
  });

  it("posts text-to-dialogue requests to the dialogue create endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([4, 5, 6]), {
        status: 200,
      })
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.textToDialogue({
      inputs: [
        {
          text: "[curious] Who is there?",
          voice_id: "JBFqnCBsd6RMkjVDRZzb",
        },
      ],
      model_id: "eleven_v3",
      output_format: "mp3_44100_128",
    });

    expect(result.byteLength).toBe(3);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      inputs: [
        {
          text: "[curious] Who is there?",
          voice_id: "JBFqnCBsd6RMkjVDRZzb",
        },
      ],
      model_id: "eleven_v3",
    });
  });

  it("routes remaining ConvAI agent endpoints", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ "agent/1": { status: "failure" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ agent_id: "agent-copy" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            agent_id: "agent/1",
            avatar_url: "https://example.com/avatar.png",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "version/1",
            agent_id: "agent/1",
            branch_id: "branch/1",
            version_description: "Initial",
            seq_no_in_branch: 1,
            time_committed_secs: 123,
            parents: {},
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            simulated_conversation: [],
            analysis: {},
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            topics: [],
            window_start_unix_secs: 1,
            window_end_unix_secs: 2,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ number_of_pages: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ llm_prices: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            traffic_percentage_branch_id_map: { "branch/1": 100 },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            created_branch_id: "branch/2",
            created_version_id: "version/2",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "branch/2",
            name: "Draft",
            agent_id: "agent/1",
            description: "Draft branch",
            created_at: 1,
            last_committed_at: 1,
            is_archived: false,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "branch/2",
            name: "Draft updated",
            agent_id: "agent/1",
            description: "Draft branch",
            created_at: 1,
            last_committed_at: 2,
            is_archived: false,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            agent_id: "agent/1",
            name: "Preview",
            conversation_config: {},
            metadata: {},
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            agent_id: "agent/1",
            name: "Preview",
            conversation_config: {},
            metadata: {},
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ count: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    expect(provider.get.v1.convai.agents.summaries).toBe(
      provider.v1.convai.agents.summaries
    );
    expect(provider.post.v1.convai.agents.duplicate).toBe(
      provider.v1.convai.agents.duplicate
    );
    expect(provider.post.v1.convai.agents.avatar).toBe(
      provider.v1.convai.agents.avatar
    );
    expect(provider.get.v1.convai.agents.versions.get).toBe(
      provider.v1.convai.agents.versions.get
    );
    expect(provider.v1.convai.agents.simulateConversation.stream).toBe(
      provider.post.v1.convai.agents.simulateConversation.stream
    );
    expect(provider.get.v1.convai.agents.branches).toBe(
      provider.v1.convai.agents.branches
    );
    expect(provider.post.v1.convai.agents.branches.create).toBe(
      provider.v1.convai.agents.branches.create
    );
    expect(provider.patch.v1.convai.agents.branches.update).toBe(
      provider.v1.convai.agents.branches.update
    );
    expect(provider.delete.v1.convai.agents.drafts.delete).toBe(
      provider.v1.convai.agents.drafts.delete
    );
    expect(provider.get.v1.convai.analytics.liveCount).toBe(
      provider.v1.convai.analytics.liveCount
    );

    await provider.v1.convai.agents.summaries({
      agent_ids: ["agent/1", "agent 2"],
    });
    await provider.v1.convai.agents.duplicate("agent/1", {
      name: "Copy",
    });
    await provider.v1.convai.agents.avatar("agent/1", {
      avatar_file: new Blob(["avatar"], { type: "image/png" }),
    });
    await provider.v1.convai.agents.versions.get("agent/1", "version/1");
    await provider.v1.convai.agents.simulateConversation("agent/1", {
      simulation_specification: {
        simulated_user_config: { first_message: "Hello" },
      },
    });
    const stream = await provider.v1.convai.agents.simulateConversation.stream(
      "agent/1",
      {
        simulation_specification: {
          simulated_user_config: { first_message: "Hello" },
        },
      }
    );
    await provider.v1.convai.agents.topics("agent/1", {
      from_unix_secs: 1,
      to_unix_secs: 2,
    });
    await provider.v1.convai.agent.knowledgeBase.size("agent/1");
    await provider.v1.convai.agent.llmUsage.calculate("agent/1", {
      prompt_length: 100,
    });
    await provider.v1.convai.agents.drafts.create("agent/1", {
      branch_id: "branch/1",
      conversation_config: {},
      platform_settings: {},
      workflow: {},
      name: "Draft",
    });
    await provider.v1.convai.agents.drafts.delete("agent/1", {
      branch_id: "branch/1",
    });
    await provider.v1.convai.agents.deployments("agent/1", {
      deployment_request: {
        requests: [
          {
            branch_id: "branch/1",
            deployment_strategy: { type: "percentage", percentage: 100 },
          },
        ],
      },
    });
    await provider.v1.convai.agents.branches.create("agent/1", {
      parent_version_id: "version/1",
      name: "Draft",
      description: "Draft branch",
    });
    await provider.v1.convai.agents.branches.get("agent/1", "branch/2");
    await provider.v1.convai.agents.branches.update("agent/1", "branch/2", {
      name: "Draft updated",
    });
    await provider.v1.convai.agents.branches.rebase("agent/1", "branch/2");
    await provider.v1.convai.agents.branches.rebasePreview(
      "agent/1",
      "branch/2"
    );
    await provider.v1.convai.agents.branches.merge("agent/1", "branch/2", {
      target_branch_id: "branch/1",
      archive_source_branch: false,
    });
    await provider.v1.convai.agents.branches.mergePreview(
      "agent/1",
      "branch/2",
      {
        target_branch_id: "branch/1",
        force: true,
      }
    );
    await provider.v1.convai.analytics.liveCount({
      agent_id: "agent/1",
    });

    expect(stream.byteLength).toBe(3);
    const calls = mockFetch.mock.calls.map(([url, init]) => ({
      url,
      method: init.method,
    }));
    expect(calls).toEqual([
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/summaries?agent_ids=agent%2F1&agent_ids=agent+2",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/duplicate",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/avatar",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/versions/version%2F1",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/simulate-conversation",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/simulate-conversation/stream",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/topics?from_unix_secs=1&to_unix_secs=2",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agent/agent%2F1/knowledge-base/size",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agent/agent%2F1/llm-usage/calculate",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/drafts?branch_id=branch%2F1",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/drafts?branch_id=branch%2F1",
        method: "DELETE",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/deployments",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/branches",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/branches/branch%2F2",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/branches/branch%2F2",
        method: "PATCH",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/branches/branch%2F2/rebase",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/branches/branch%2F2/rebase-preview",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/branches/branch%2F2/merge?target_branch_id=branch%2F1",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/agents/agent%2F1/branches/branch%2F2/merge-preview?target_branch_id=branch%2F1&force=true",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/analytics/live-count?agent_id=agent%2F1",
        method: "GET",
      },
    ]);
    const [, duplicateInit] = mockFetch.mock.calls[1];
    expect(JSON.parse(duplicateInit.body as string)).toEqual({ name: "Copy" });
    const [, avatarInit] = mockFetch.mock.calls[2];
    expect(avatarInit.body).toBeInstanceOf(FormData);
  });

  it("routes remaining ConvAI conversation endpoints", async () => {
    const conversationResponse = {
      agent_id: "agent/1",
      conversation_id: "conv/1",
      status: "done",
      metadata: {},
      has_audio: false,
      has_user_audio: false,
      has_response_audio: false,
      transcript: [],
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "livekit-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [],
            has_more: false,
            next_cursor: null,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [],
            has_more: false,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ file_id: "file/1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ file_id: "file/1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sip_messages: [],
            has_more: false,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(conversationResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(conversationResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    expect(provider.get.v1.convai.conversation.token).toBe(
      provider.v1.convai.conversation.token
    );
    expect(provider.get.v1.convai.conversations.messages.smartSearch).toBe(
      provider.v1.convai.conversations.messages.smartSearch
    );
    expect(provider.get.v1.convai.conversations.messages.textSearch).toBe(
      provider.v1.convai.conversations.messages.textSearch
    );
    expect(provider.post.v1.convai.conversations.feedback).toBe(
      provider.v1.convai.conversations.feedback
    );
    expect(provider.post.v1.convai.conversations.files).toBe(
      provider.v1.convai.conversations.files
    );
    expect(provider.delete.v1.convai.conversations.files.delete).toBe(
      provider.v1.convai.conversations.files.delete
    );
    expect(provider.get.v1.convai.conversations.sipMessages).toBe(
      provider.v1.convai.conversations.sipMessages
    );
    expect(provider.post.v1.convai.conversations.tags).toBe(
      provider.v1.convai.conversations.tags
    );
    expect(provider.delete.v1.convai.conversations.tags.unassign).toBe(
      provider.v1.convai.conversations.tags.unassign
    );
    expect(provider.post.v1.convai.conversations.analysis).toBe(
      provider.v1.convai.conversations.analysis
    );
    expect(provider.post.v1.convai.conversations.analysis.evaluations).toBe(
      provider.v1.convai.conversations.analysis.evaluations
    );

    expect(
      provider.v1.convai.conversation.token.schema.safeParse({
        agent_id: "agent/1",
      }).success
    ).toBe(true);
    expect(
      provider.v1.convai.conversations.tags.schema.safeParse({
        tag_ids: [],
      }).success
    ).toBe(false);

    await provider.v1.convai.conversation.token({
      agent_id: "agent/1",
      participant_name: "Test User",
      branch_id: "branch/1",
      environment: "staging",
    });
    await provider.v1.convai.conversations.messages.smartSearch({
      text_query: "hello world",
      agent_id: "agent/1",
      page_size: 2,
      cursor: "cursor/1",
    });
    await provider.v1.convai.conversations.messages.textSearch({
      text_query: "hello",
      call_successful: "success",
      topic_ids: ["topic/1"],
      sort_by: "created_at",
    });
    await provider.v1.convai.conversations.feedback("conv/1", {
      feedback: "like",
    });
    await provider.v1.convai.conversations.files("conv/1", {
      file: new Blob(["file"], { type: "application/pdf" }),
    });
    await provider.v1.convai.conversations.files.delete("conv/1", "file/1");
    await provider.v1.convai.conversations.sipMessages("conv/1", {
      page_size: 2,
      cursor: "sip/cursor",
    });
    await provider.v1.convai.conversations.tags("conv/1", {
      tag_ids: ["tag/1"],
    });
    await provider.v1.convai.conversations.tags.unassign("conv/1", "tag/1");
    await provider.v1.convai.conversations.analysis("conv/1");
    await provider.v1.convai.conversations.analysis.evaluations("conv/1", {
      evaluation_id: "eval/1",
      scope: "agent",
    });

    const calls = mockFetch.mock.calls.map(([url, init]) => ({
      url,
      method: init.method,
    }));
    expect(calls).toEqual([
      {
        url: "https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent%2F1&participant_name=Test+User&branch_id=branch%2F1&environment=staging",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/messages/smart-search?text_query=hello+world&agent_id=agent%2F1&page_size=2&cursor=cursor%2F1",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/messages/text-search?text_query=hello&call_successful=success&topic_ids=topic%2F1&sort_by=created_at",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/feedback",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/files",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/files/file%2F1",
        method: "DELETE",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/sip-messages?page_size=2&cursor=sip%2Fcursor",
        method: "GET",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/tags",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/tags/tag%2F1",
        method: "DELETE",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/analysis/run",
        method: "POST",
      },
      {
        url: "https://api.elevenlabs.io/v1/convai/conversations/conv%2F1/analysis/evaluations/run",
        method: "POST",
      },
    ]);

    const [, feedbackInit] = mockFetch.mock.calls[3];
    expect(JSON.parse(feedbackInit.body as string)).toEqual({
      feedback: "like",
    });
    const [, uploadInit] = mockFetch.mock.calls[4];
    expect(uploadInit.body).toBeInstanceOf(FormData);
    const [, tagsInit] = mockFetch.mock.calls[7];
    expect(JSON.parse(tagsInit.body as string)).toEqual({
      tag_ids: ["tag/1"],
    });
    const [, evaluationInit] = mockFetch.mock.calls[10];
    expect(JSON.parse(evaluationInit.body as string)).toEqual({
      evaluation_id: "eval/1",
      scope: "agent",
    });
  });
});
